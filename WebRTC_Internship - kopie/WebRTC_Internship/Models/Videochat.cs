using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure.Internal;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Threading.Tasks;

namespace WebRTC_Internship.Models
{
    public class VideochatModel
    {
        public long ID { get; set; }
        public string UUID { get; set; }
        public DateTime Start { get; set; }
        public DateTime End { get; set; }
    }

    public class VideochatDBContext : DbContext
    {
        public DbSet<VideochatModel> Videochat { get; set; }
        public DbSet<ContactModel> Contact { get; set; }

        protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
        {
            optionsBuilder.UseSqlite("Data Source=Videochat.db");
        }
    }
}
