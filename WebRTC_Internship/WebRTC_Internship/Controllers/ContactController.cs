using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using WebRTC_Internship.Models;
using System.Web;
using WebRTC_Internship.Data;
using Microsoft.AspNetCore.Identity;
using WebRTC_Internship.Services;
using Microsoft.Extensions.Logging;
using Microsoft.AspNetCore.Http;
using System.IO;

namespace WebRTC_Internship.Controllers
{
    [RequireHttps]
    [Authorize]
    [Route("/api/[controller]/[action]")]
    public class ContactController : Controller
    {
        //Define managers
        private UserManager<ApplicationUser> _userManager;
        private SignInManager<ApplicationUser> _signInManager;
        private IEmailSender _emailSender;
        private ILogger _logger;

        public ContactController(
            UserManager<ApplicationUser> userManager,
            SignInManager<ApplicationUser> signInManager,
            IEmailSender emailSender,
            ILogger<AccountController> logger)
        {
            _userManager = userManager;
            _signInManager = signInManager;
            _emailSender = emailSender;
            _logger = logger;
        }

        //Connect to Contacts database
        private VideochatDBContext db = new VideochatDBContext();

        //Gets current user
        public String getcurrentuser()
        {
            string returnstring = "";
            returnstring += _userManager.GetUserId(User);
            return returnstring;
        }

        public IActionResult Contact()
        {
            return Redirect("https://www.herreweb.nl/api/Contact/Home");
        }

        public IActionResult Home()
        {
            return View();
        }

        [HttpPost("UploadFiles")]
        public async Task<IActionResult> Uploadfile(List<IFormFile> files)
        {
            //<==Code from ASP .NET Core official documentation==>
            long size = files.Sum(f => f.Length);
            string id = _userManager.GetUserId(User);
            try
            {
                if (files[0].Length > 0)
                {
                    //if in future more files are needed for uploading, this could be changed easily.
                    var stream = new FileStream(("wwwroot/images/contacts/" + id + ".jpg"), FileMode.Create);
                    await files[0].CopyToAsync(stream);
                }
            }
            catch
            {
                return Content("500");
            }
            return Redirect("/api/contact/home");
        }

        public async  Task<String> getcontacts()
        {
            string id = _userManager.GetUserId(User);
            var contacts = db.Contact.Where<ContactModel>(b => b.ContactUUID.Contains(id));
            string returnstring = "";
            foreach (var item in contacts)
            {
                if(item.Status == "Rejected")
                {
                    continue;
                }
                var remoteuser = await _userManager.FindByNameAsync(item.Name);
                if (item.Status != "Rejected" && item.UUID == id)
                {
                    var selected = await _userManager.FindByIdAsync(item.User_ID);
                    returnstring += selected.UserName + ";" + selected.Id + ";" + item.Status + "|";
                    continue;
                    //returnstring += item.Name + ";" + item.UUID +
                }
                if(item.Status == "Submitted")
                {
                    returnstring += item.Name + ";" + item.UUID + ";" + "Outgoing" + "|";
                    continue;
                }
                returnstring += item.Name + ";" + item.UUID + ";" + item.Status + "|";
            }
            return returnstring;
        }

        [HttpGet("{username}")]
        public async Task<IActionResult> Addcontact(string username)
        {
            string name = User.Identity.Name;
            if(username == name)
            {
                return Content("Not Allowed, same user!");
            }
            string id = _userManager.GetUserId(User);
            var user = await _userManager.FindByNameAsync(username);
            if (user != null && id != null)
            {
                string testid = user.Id + id;
                //if (db.Contact.Find(testid) == null)
                //{
                //    return null;
                //}
                ContactModel contact = new ContactModel();
                contact.User_ID = id;
                contact.UUID = user.Id;
                contact.Status = "Submitted";
                contact.Email = user.Email;
                contact.Name = user.UserName;
                contact.ContactUUID = id + user.Id;
                if (ModelState.IsValid)
                {
                    db.Contact.Add(contact);
                    db.SaveChanges();
                    return Content("200");
                }
                else
                {
                    return Content("400");
                }
            }
            return Content("401");
        }

        [HttpGet("{contactid}")]
        public IActionResult ShowContact(string contactid)
        {
            string text = "";
            foreach (ContactModel contact in db.Contact)
            {
                if (contact.User_ID == contactid)
                {
                    text += contact.ContactUUID.ToString() + "\n";
                }

            }
            return Content(text);
        }

        [HttpGet("{searchquery}")]
        public async Task<string> Search(string searchquery)
        {
            searchquery.ToLower();
            var userlist = _userManager.Users.ToList();
            string returnstring = "";
            foreach (var item in userlist)
            {
                if (item.UserName.ToLower().Contains(searchquery)) { returnstring += item.UserName.ToString() + ";" + item.Id.ToString() + "|"; }
            }
            return returnstring;
        }

        public class inviteinfo
        {
            public string accept;
            public string contactuuid;
        }

        [HttpPost]
        public async Task<HttpRequestMessage> Invite([FromBody] inviteinfo info)
        {
            string id = _userManager.GetUserId(User);
            string contactuuid = info.contactuuid + id;
            if (info != null)
            {
                var contacts = db.Contact.Where<ContactModel>(b => b.ContactUUID == contactuuid);
                if (contacts != null)
                {
                    foreach(var item in contacts)
                    {
                        if (info.accept == "true")
                        {
                            item.Status = "Approved";
                            db.SaveChanges();
                           // var user = await _userManager.FindByIdAsync(info.contactuuid);
                           // await Addcontact(user.UserName);
                            return null;
                        }
                        item.Status = "Rejected";
                        db.SaveChanges();
                        return null;
                    }
                }
            }
            return null;
        }



    }
}